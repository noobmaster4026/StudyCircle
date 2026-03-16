const mongoose = require('mongoose');

const { Schema } = mongoose;

const indInfoSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        courses: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Course',
            },
        ],
    },
    {
        timestamps: true,
        collection: 'ind_infos',
    }
);

module.exports = mongoose.model('IndInfo', indInfoSchema);

