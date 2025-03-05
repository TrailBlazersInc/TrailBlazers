import mongoose, {Schema, Document} from 'mongoose';

export interface IReport extends Document {
    _id: mongoose.Types.ObjectId,
    description: string,
    aggressorEmail: string,
    reporterEmail: string,
}

const ReportSchema = new Schema<IReport>({
    description: String,
    aggressorEmail: String,
    reporterEmail: String
})


export const Report = mongoose.model<IReport>("Report", ReportSchema);