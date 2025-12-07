import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  passwordHash: string;
  role: 'admin';
  createdAt: Date;
  lastLogin?: Date;
}

export const UserSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'passwordHash', 'role', 'createdAt'],
      properties: {
        username: {
          bsonType: 'string',
          description: 'Username must be a string and is required',
        },
        passwordHash: {
          bsonType: 'string',
          description: 'Password hash must be a string and is required',
        },
        role: {
          enum: ['admin'],
          description: 'Role must be admin',
        },
        createdAt: {
          bsonType: 'date',
          description: 'Created date must be a date and is required',
        },
        lastLogin: {
          bsonType: 'date',
          description: 'Last login date must be a date',
        },
      },
    },
  },
};
