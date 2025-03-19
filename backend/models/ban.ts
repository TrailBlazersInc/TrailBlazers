import mongoose from 'mongoose';
const { Schema } = mongoose;

export interface IBan extends Document {
    userId: string;
    reason: string;
    bannedAt: Date;
    expiresAt: Date;
}

const banSchema = new Schema<IBan>({
    userId: { type: String, required: true },
    reason: { type: String, required: true },
    bannedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
});

export const Ban = mongoose.model<IBan>("Ban", banSchema);