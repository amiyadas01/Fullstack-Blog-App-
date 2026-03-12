import mongoose, { Schema, Document } from "mongoose";

interface SessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  device?: string;
  ipAddress?: string;
  expiresAt: Date;
}

const sessionSchema = new Schema<SessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
    },

    device: {
      type: String,
    },

    ipAddress: {
      type: String,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model<SessionDocument>("Session", sessionSchema);

export default Session;