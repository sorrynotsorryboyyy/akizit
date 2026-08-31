'use client';

import { useEffect, useRef, useState } from 'react';
// MapLibre v6 n'expose plus d'export par défaut : uniquement des exports
// nommés. Un `import maplibregl from 'maplibre-gl'` échouerait à la
// compilation.
import {
  Map as MapLibreMap,
  NavigationControl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
  type MapMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { VERTICALS } from '@/lib/verticals/registry';
import type { LeadPublic } from '@/lib/leads/types';

/**
 * Carte MapLibre.
 *
 * Ce composant est chargé dynamiquement avec `ssr: false` par LeadsMap :
 * maplibre-gl touche `window` dès l'import, un simple `'use client'` ne
 * suffirait pas puisque le module serait tout de même évalué au pré-rendu.
 *
 * L'import du CSS vit ici, dans le module chargé dynamiquement, sinon les
 * contrôles de la carte s'affichent cassés.
 */

/** Tuiles OpenFreeMap : gratuites, sans clé, usage commercial autorisé. */
const TILES_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const FRANCE_CENTER: [number, number] = [2.45, 46.6];
const FRANCE_BOUNDS: [[number, number], [number, number]] = [
  [-5.8, 41.2],
  [10.0, 51.6],
];

const SOURCE_ID = 'leads';

type Props = {
  leads: LeadPublic[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

function toGeoJSON(leads: LeadPublic[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: leads.map((lead) => ({
      type: 'Feature',
      id: lead.id,
      geometry: { type: 'Point', coordinates: [lead.lng, lead.lat] },
      properties: {
        leadId: lead.id,
        color: VERTICALS[lead.vertical].color,
        // Un lead épuisé reste visible mais grisé : il prouve l'activité de
        // la plateforme sans laisser croire qu'il est encore achetable.
        soldOut: lead.status === 'sold_out' ? 1 : 0,
      },
    })),
  };
}

export default function MapCanvas({ leads, selectedId, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  // L'instance vit dans une ref et non dans un state : un setState porteur de
  // l'objet map déclencherait un rendu à chaque interaction.
  const map = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);

  // `onSelect` change d'identité à chaque rendu du parent. Le passer en
  // dépendance de l'effet d'initialisation détruirait et recréerait la carte
  // à chaque frappe dans les filtres. On garde donc la dernière version dans
  // une ref, et l'effet d'init reste à dépendances vides.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Initialisation : dépendances vides, la carte n'est créée qu'une fois.
  useEffect(() => {
    if (!container.current || map.current) return;

    const instance = new MapLibreMap({
      container: container.current,
      style: TILES_STYLE,
      center: FRANCE_CENTER,
      zoom: 4.9,
      maxBounds: FRANCE_BOUNDS,
      attributionControl: { compact: true },
    });

    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');

    instance.on('load', () => {
      instance.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 45,
        clusterMaxZoom: 11,
      });

      // --- Amas ---
      instance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#0b6b4f',
          'circle-opacity': 0.9,
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(255,255,255,0.85)',
          'circle-radius': ['step', ['get', 'point_count'], 17, 10, 22, 40, 29],
        },
      });

      instance.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // --- Points isolés ---
      instance.addLayer({
        id: 'lead-points',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'soldOut'], 1],
            '#9aa8a2',
            ['get', 'color'],
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': ['case', ['==', ['get', 'soldOut'], 1], 0.55, 1],
        },
      });

      // Halo du lead sélectionné, sous les points pour ne pas les masquer.
      instance.addLayer(
        {
          id: 'lead-selected',
          type: 'circle',
          source: SOURCE_ID,
          filter: ['==', ['get', 'leadId'], ''],
          paint: {
            'circle-color': '#0b6b4f',
            'circle-opacity': 0.22,
            'circle-radius': 20,
          },
        },
        'lead-points',
      );

      setReady(true);
    });

    // --- Interactions ---
    instance.on('click', 'lead-points', (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.leadId;
      if (typeof id === 'string') onSelectRef.current(id);
    });

    instance.on('click', 'clusters', async (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const source = instance.getSource(SOURCE_ID) as GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(
        feature.properties.cluster_id as number,
      );
      instance.easeTo({
        center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
        zoom,
      });
    });

    // Clic dans le vide : on referme le panneau de détail.
    instance.on('click', (e: MapMouseEvent) => {
      const hits = instance.queryRenderedFeatures(e.point, {
        layers: ['lead-points', 'clusters'],
      });
      if (hits.length === 0) onSelectRef.current(null);
    });

    for (const layer of ['lead-points', 'clusters']) {
      instance.on('mouseenter', layer, () => {
        instance.getCanvas().style.cursor = 'pointer';
      });
      instance.on('mouseleave', layer, () => {
        instance.getCanvas().style.cursor = '';
      });
    }

    map.current = instance;

    // Sans ce nettoyage, le Fast Refresh empile les instances WebGL jusqu'à
    // saturer le contexte graphique du navigateur.
    return () => {
      instance.remove();
      map.current = null;
    };
    // Volontairement sans dépendances : la carte n'est créée qu'une fois.
  }, []);

  // Mise à jour des données sans réinitialiser la carte.
  useEffect(() => {
    if (!ready || !map.current) return;
    const source = map.current.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(toGeoJSON(leads));
  }, [leads, ready]);

  // Mise en évidence du lead sélectionné.
  useEffect(() => {
    if (!ready || !map.current) return;
    map.current.setFilter('lead-selected', ['==', ['get', 'leadId'], selectedId ?? '']);
  }, [selectedId, ready]);

  return (
    <div className="relative h-full w-full">
      {/* La hauteur vient du parent : sans hauteur explicite au montage, la
          carte s'initialise à 0 px et reste grise. */}
      <div ref={container} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-surface-muted">
          <p className="text-sm text-ink-faint">Chargement de la carte…</p>
        </div>
      )}
    </div>
  );
}
