import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs';

export default class FilesController {
  static async postUpload(request, response) {
    const userToken = request.get('X-Token');

    if (typeof userToken !== 'string') {
      response.status(403);
      response.send({ error: 'Forbidden' });
      return;
    }

    const userEmail = redisClient.get(userToken);

    if (typeof userEmail !== 'string') {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }

    const fileObject = {
      name: request.body.name,
      type: request.body.type,
      isPublic: request.body.isPublic,
      parentId: request.body.parentId || 0,
    };
    let parentFile;

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

      if (typeof parentFile !== 'object') {
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

    fileObject.userId = dbClient.userId(email);

    if (typeof fileObject.userId !== 'string') {
      response.statparentFileus(500);
      response.send({ error: 'User id not found or invalid' });
      return;
    }

    if (request.body.type === 'folder') {
      const insertResult = await dbClient.addFile(fileObject);

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

    fileObject.localPath = (process.env.FOLDER_PATH || '/tmp/files_manager/')
      + uuidv4();
    const fileContent = atob(request.body.data);

    writeFile(fileObject.localPath, fileContent);
    const insertResult = dbClient.addFile(fileObject);

    if (!insertResult.result.ok) {
      response.status(500);
      response.send({ error: 'Failed to add file' });
      return;
    }

    response.status(201);
    response.send({ id: insertResult.insertedId, ...fileObject });
  }
}
