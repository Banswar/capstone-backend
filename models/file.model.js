import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    fileName: {                  // user_database_backup.sql
        type: String,
        required: true
    },
    type: {                  // .sql
        type: String,
        required: true
    },
    size: {                 // 5 mb
        type: Number,
        required: true
    },
    path: {                 // public url
        type: String,
        required: true
    },
    uploadedByUserId: {           // user id
        type: String,
        required: true
    },

    uploadedByUserName: {    // user name
        type: String,
        required: true,
    },

    departmentId: {     // department Id
        type: String,
        required: true,
    },

    accessLevel: {
        type: [String],
        enum: ['admin', 'department_head', 'employee', 'guest'], 
        required: true
    },
    riskScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    tags: {            // ['database', 'backup', 'users']
        type: [String]
    },

    contentAnalysis: {
        contentCategory: {    // ['database', 'code']
            type: [String]
        },
        keywords: {          // ['insert', 'user', 'table', 'database', 'select']
            type: [String]
        },
        language: {          // 'sql'
            type: String
        },
        readingLevel: {      // advanced
            type: String
        },
        sensitiveContent: {   // true
            type: Boolean
        },
        maliciousContent: {   // false
            type: Boolean
        },
        detectedEntities: {    // ['table', 'column', 'data']
            type: [String]
        }
    }
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);

export default File;
