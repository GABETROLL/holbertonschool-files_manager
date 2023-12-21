import { access, mkdir, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class FilesController {
  static async postUpload(request, response) {
    const userToken = request.get('X-Token');

    if (typeof userToken !== 'string') {
      response.status(403);
      response.send({ error: 'Forbidden' });
      return;
    }

    const userEmail = await redisClient.getUserEmail(userToken);

    if (typeof userEmail !== 'string') {
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
    };
    let parentFile;

    // console.log(`fileObject: ${fileObject}`);

    // TODO: PREVENT DUPLICATES
    if (typeof fileObject.name !== 'string') {
      response.status(400);
      response.send({ error: 'Missing name' });
      return;
    }
    // console.log(`fileObject: ${fileObject}`);
    if (fileObject.type !== 'folder' && fileObject.type !== 'file' && fileObject.type !== 'image') {
      response.status(400);
      response.send({ error: 'Missing type' });
      return;
    }
    // console.log(`fileObject: ${fileObject}`);
    if (!request.body.data && fileObject.type !== 'folder') {
      response.status(400);
      response.send({ error: 'Missing data' });
      return;
    }
    // console.log(`fileObject: ${fileObject}`);
    if (fileObject.parentId) {
      parentFile = await dbClient.fileWithID(fileObject.parentId);
      console.log(`parentFile: ${parentFile}`);

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
    // console.log(`fileObject: ${fileObject}`);
    if (fileObject.isPublic !== true) {
      fileObject.isPublic = false;
    }
    // console.log(`fileObject: ${fileObject}`);

    const userObject = await dbClient.userObject(userEmail);
    // console.log(`userObject: ${userObject}`);

    if (!userObject) {
      response.status(500);
      response.send({ error: 'User not found or invalid' });
      return;
    }
    fileObject.userId = userObject._id;
    // console.log(`userObject: ${userObject}`);

    if (!fileObject.userId) {
      response.status(500);
      response.send({ error: 'User id not found or invalid' });
      return;
    }

    if (request.body.type === 'folder') {
      const insertResult = await dbClient.addFile(fileObject);
      // console.log(`insertResult: ${insertResult}`);

      // verify the result was ok
      if (!insertResult.result.ok) {
        response.status(500);
        response.send({ error: 'Failed to add file' });
        return;
      }

      response.status(201);
      response.send({ id: insertResult.insertedId, ...fileObject });
      return;
    }

    let fileDir = process.env.FOLDER_PATH;
    // console.log(`fileDir: ${fileDir}`);

    if (!fileDir) {
      fileDir = '/tmp/files_manager/';

      if (!access(fileDir)) {
        try {
          mkdir(fileDir);
        } catch (error) {
          response.status(500);
          response.send({ error: 'Failed to add file' });
          return;
        }
      }
    }

    fileObject.localPath = fileDir + uuidv4();
    // console.log(`fileObject: ${fileObject}`);

    const fileContent = Buffer.from(request.body.data)
      .toString('ascii');
    // console.log(fileContent);

    try {
      await writeFile(fileObject.localPath, fileContent);
    } catch (error) {
      response.status(500);
      response.send({ error: 'Failed to add file' });
      return;
    }

    const insertResult = await dbClient.addFile(fileObject);

    if (!insertResult.result.ok) {
      // maybe TODO: remove file
      response.status(500);
      response.send({ error: 'Failed to add file' });
      return;
    }

    response.status(201);
    response.send({ id: insertResult.insertedId, ...fileObject });
  }
}
