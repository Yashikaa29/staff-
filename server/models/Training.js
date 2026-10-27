import mongoose from 'mongoose';

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: 'All',
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Upcoming', 'In-Progress', 'Completed'],
      default: 'Upcoming',
    },
  },
  {
    timestamps: true,
  }
);

const Training = mongoose.models.Training || mongoose.model('Training', trainingSchema);

export default Training;
