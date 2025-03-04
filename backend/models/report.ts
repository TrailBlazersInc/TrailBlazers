import mongoose, {Schema, Document} from 'mongoose';

export interface IReport extends Document {
    _id: mongoose.Types.ObjectId,
    type: string,
    aggressorEmail: string,
    reporterEmail: string,
    description: string
}

const ReportSchema = new Schema<IReport>({
    type: String,
    aggressorEmail: String,
    reporterEmail: String,
    description: String
})


export const Report = mongoose.model<IReport>("Report", ReportSchema);