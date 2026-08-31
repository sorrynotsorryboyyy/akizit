import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { releaseExpiredReservations } from '@/lib/orders/reserve';
import { adminConfigured } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Libération des réservations abandonnées.
 *
 * Complète le traitement paresseux (tout lecteur traite une réservation
 * périmée comme libre) : sans ce balayage, un lead abandonné en cours de
 * paiement resterait invisible sur la carte jusqu'à la prochaine tentative
 * d'achat.
 *
 * Déclenchée par Vercel Cron toutes les dix minutes.
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET non configuré.' },
      { status: 503 },
    );
  }

  // Vercel Cron envoie le secret en Bearer ; comparaison à temps constant.
  const provided = request.headers.get('authorization')?.replace('Bearer ', '') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, error: 'Non autorisé.' }, { status: 401 });
  }

  if (!adminConfigured) {
    return NextResponse.json(
      { ok: false, error: 'Backend non configuré.' },
      { status: 503 },
    );
  }

  const result = await releaseExpiredReservations();

  return NextResponse.json({ ok: true, ...result });
}
