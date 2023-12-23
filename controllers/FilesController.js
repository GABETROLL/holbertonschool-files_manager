import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import ObjectId from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { mkdir, writeFile } = fsPromises;

export default class FilesController {
  static async postUpload(request, response) {
    const userToken = request.get('X-Token');

    if (typeof userToken !== 'string') {
      response.status(403);
      response.send({ error: 'Forbidden' });
      return;
    }

    const userId = await redisClient.getUserId(userToken);

    if (!userId || !(await dbClient.userById(userId))) {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }

    // console.log('About to construct fileObject...');

    const fileObject = {
      name: request.body.name,
      type: request.body.type,
      isPublic: request.body.isPublic,
      parentId: request.body.parentId || 0,
      userId: ObjectId(userId),
    };
    let parentFile;

    // console.log(fileObject);

    // TODO: PREVENT DUPLICATES
    if (typeof fileObject.name !== 'string') {
      response.status(400);
      response.send({ error: 'Missing name' });
      return;
    }
    if (fileObject.type !== 'folder' && fileObject.type !== 'file' && fileObject.type !== 'image') {
      response.status(400);
      response.send({ error: 'Missing type' });
      return;
    }
    if (!request.body.data && fileObject.type !== 'folder') {
      response.status(400);
      response.send({ error: 'Missing data' });
      return;
    }
    if (fileObject.parentId) {
      parentFile = await dbClient.fileWithID(fileObject.parentId);
      // console.log(`parentFile: ${parentFile}`);

      if (!parentFile) {
        response.status(400);
        response.send({ error: 'Parent not found' });
        return;
      }

      if (parentFile.type !== 'folder') {
        response.status(400);
        response.send({ error: 'Parent is not a folder' });
        return;
      }
    }
    if (fileObject.isPublic !== true) {
      fileObject.isPublic = false;
    }
    // console.log(fileObject);

    if (fileObject.type !== 'folder') {
      // console.log('NOT FOLDER');

      const fileDir = process.env.FOLDER_PATH || '/tmp/files_manager/';
      // console.log(`fileDir: ${fileDir}`);

      try {
        await mkdir(fileDir);
      } catch (error) { }

      fileObject.localPath = fileDir + uuidv4();
      // console.log(`fileObject: ${fileObject}`);

      const fileContent = Buffer.from(request.body.data, 'base64')
        .toString('ascii');
      // console.log(`fileContent: ${fileContent}`);

      try {
        await writeFile(fileObject.localPath, fileContent);
      } catch (error) {
        response.status(500);
        response.send({ error: 'Failed to add file' });
        return;
      }
    }

    const insertResult = await dbClient.addFile(fileObject);

    if (!insertResult.result.ok) {
      // maybe TODO: remove file
      response.status(500);
      response.send({ error: 'Failed to add file' });
      return;
    }

    // ``await dbClient.addFile(fileObject)``
    // inserts the mongo-generated ``_id`` into the object
    // as a side-effect,
    // but we want to response with ``id`` as the key,
    // not ``_id``.
    fileObject.id = fileObject._id;
    delete fileObject._id;

    // console.log(fileObject);

    response.status(201);
    response.send(fileObject);
  }

  static async getShow(request, response) {
    const userSessionToken = request.get('X-Token');

    if (!userSessionToken) {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }

    const userId = await redisClient.getUserId(userSessionToken);

    if (!userId) {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }

    const fileWithId = await dbClient.fileWithID(request.params.id);

    if (!fileWithId || !fileWithId.userId || fileWithId.userId.toString() !== userId) {
      response.status(404);
      response.send({ error: 'Not found' });
      return;
    }

    response.send(fileWithId);
  }

  static async getIndex(request, response) {
    const userSessionToken = request.get('X-Token');

    if (!userSessionToken) {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }


  }
}
