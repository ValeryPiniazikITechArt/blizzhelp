const crypto = require('crypto');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const config = require('../../config');

class ArticleImageStorage {
  constructor() {
    this.gfs = null;
    mongoose.connect(config.get('connectionString'), {
      useNewUrlParser: true,
    });
    mongoose.connection.once('open', () => {
      this.gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'articleImageUploads',
      });
    });
    this.storage = new GridFsStorage({
      url: config.get('connectionString'),
      useNewUrlParser: true,
      file: (req, file) => new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const _filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: _filename,
            bucketName: 'articleImageUploads',
          };
          return resolve(fileInfo);
        });
      }),
    });
    this.upload = multer({ storage: this.storage });
  }

  getUpload() {
    return this.upload;
  }

  deleteFileById(id, callback) {
    this.gfs.delete(id, (err) => {
      if (err) {
        callback(err);
      } else {
        callback();
      }
    });
  }
}

module.exports = ArticleImageStorage;
