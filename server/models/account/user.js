const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const UserSchema = require('../../schemes/account/user_schema');
const SessionStore = require('../sessions/sessionStore');

class User {
  constructor() {
    this.refReq = undefined;
    this.user = mongoose.model('User', UserSchema);
  }

  initializeUser(req) {
    this.refReq = {
      receivedReq: req,
    };
  }

  getCountOfSuperAdmins(callback) {
    this.user.find().estimatedDocumentCount({
      user_role: 'superAdmin',
    }, (err, count) => {
      callback(err, count);
    });
  }

  getUserById(userId, callback) {
    return this.user.findById(userId, (err, foundUser) => {
      if (err) {
        return callback(err);
      }
      if (!foundUser) {
        const userNotFoundErr = new Error('User not found.');
        userNotFoundErr.status = 401;
        return callback(userNotFoundErr);
      }
      return callback(null);
    });
  }

  getUserByEmail(userEmail, callback) {
    return this.user.findOne({
      email: userEmail,
    }, (err, foundUser) => {
      if (err) {
        return callback(err);
      }
      if (!foundUser) {
        const userNotFoundErr = new Error('User not found.');
        userNotFoundErr.status = 401;
        return callback(userNotFoundErr);
      }
      return callback(foundUser);
    });
  }

  createUser(callback) {
    const userData = {
      email: this.refReq.receivedReq.body.email,
      username: this.refReq.receivedReq.body.username,
      password: this.refReq.receivedReq.body.password,
      user_role: 'user',
    };
    this.user.create(userData, (err) => {
      callback(err);
    });
  }

  createSuperAdmin(userEmail, userName, userPassword, callback) {
    const userData = {
      email: userEmail,
      username: userName,
      password: userPassword,
      user_role: 'superAdmin',
    };
    this.user.create(userData, (err) => {
      callback(err, userData.username);
    });
  }

  logOutUser(callback) {
    this.refReq.receivedReq.session.destroy((err) => {
      callback(err);
    });
  }

  authenticateUser(callback) {
    const localReq = { req: this.refReq.receivedReq };
    this.user.findOne({ email: localReq.req.body.email })
      .exec((err, user) => {
        if (err) {
          return callback(err);
        }
        if (!user) {
          const userNotFoundErr = new Error('User not found.');
          userNotFoundErr.status = 401;
          return callback(userNotFoundErr);
        }
        return bcrypt.compare(localReq.req.body.password, user.password, (compareErr, result) => {
          if (result === true) {
            SessionStore.createSession(user, localReq.req);
          }
          if (result === false) {
            const passwordDosentMatchErr = new Error('Wrong password.');
            passwordDosentMatchErr.status = 500;
            return callback(passwordDosentMatchErr);
          }
          return callback(null);
        });
      });
  }
}

module.exports = User;
