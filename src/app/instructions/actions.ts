'use server';

import {db} from "@/db/drizzle";

export async function checkDonorIdExists(externalDonorId: string): Promise<boolean> {
    if (!externalDonorId.trim()) {
        return false;
    }

    const existingDonation = await db.query.donations.findFirst({
        where: (donations, { eq }) => eq(donations.externalDonorId, externalDonorId)
    });

    return !!existingDonation;
}