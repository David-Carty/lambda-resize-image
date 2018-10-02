import AWSMock from 'aws-sdk-mock';
import fs from 'fs';
import path from 'path';
import { generateS3Key, resizeCallback } from '../../../src/lib/utils';

describe('Test resizeCallback error', () => {
  const newKey = 'new_default_640x480.jpg';
  const newPathKey = `${process.env.URL}/${newKey}`;
  const defaultImage = path.resolve(
    __dirname + '../../../images/default_640x480.jpg'
  );
  const tmpImageName = `${__dirname}/images/${newKey}`;

  beforeAll(() => {
    fs.createReadStream(defaultImage).pipe(fs.createWriteStream(tmpImageName));
    AWSMock.mock('S3', 'upload', (params, callback) => {
      callback(true, null);
    });
  });

  afterEach(() => {
    delete process.env.BUCKET;
    delete process.env.URL;
  });

  afterAll(() => {
    AWSMock.restore('S3');
  });

  test('Sending a error param, must return an error', () => {
    expect.assertions(1);
    const error = {
      error: 'Something went Wrong!'
    };

    return expect(
      resizeCallback(error, newPathKey, newPathKey)
    ).rejects.toEqual({
      error: 'Something went Wrong!'
    });
  });

  test('Getting am error sending image to S3', () => {
    expect.assertions(1);
    const error = null;

    return expect(
      resizeCallback(error, newPathKey, tmpImageName)
    ).rejects.toBeTruthy();
  });
});

describe('Test resizeCallback success', () => {
  const newKey = 'new_default_640x480.jpg';
  const newPathKey = `${process.env.URL}/${newKey}`;
  const defaultImage = path.resolve(
    __dirname + '../../../images/default_640x480.jpg'
  );
  const tmpImageName = `${__dirname}/images/${newKey}`;

  beforeAll(() => {
    fs.createReadStream(defaultImage).pipe(fs.createWriteStream(tmpImageName));
    AWSMock.mock('S3', 'upload', (params, callback) => {
      const data = {
        Location: newPathKey
      };

      callback(null, data);
    });
  });

  afterEach(() => {
    delete process.env.BUCKET;
    delete process.env.URL;
  });

  afterAll(() => {
    AWSMock.restore('S3');
  });

  test('Sending a successfull image to AWS S3', () => {
    process.env.BUCKET = 'my-bucket-here';
    process.env.URL = 'localhost:3000';
    const error = null;

    return resizeCallback(error, newPathKey, tmpImageName).then(data => {
      expect(data).toMatchObject({
        statusCode: 301,
        headers: { Location: newPathKey }
      });
    });
  });
});

describe('Test generateS3Key', () => {
  test('Require both sizes width and height', () => {
    const size = {
      width: 100,
      height: 100
    };

    expect(generateS3Key('xpto/name_here.jpg', size)).toEqual(
      `xpto/${size.width}x${size.height}/name_here.jpg`
    );
  });

  test('Require only size width', () => {
    const size = {
      width: 100,
      height: null
    };

    expect(generateS3Key('xpto/name_here.jpg', size)).toEqual(
      `xpto/${size.width}xAUTO/name_here.jpg`
    );
  });

  test('Without basename, must return a key only', () => {
    const size = {
      width: null,
      height: null
    };

    expect(generateS3Key('name_here.jpg', size)).toEqual('name_here.jpg');
  });

  test('Both sizes empty', () => {
    const size = {
      width: null,
      height: null
    };

    expect(generateS3Key('xpto/name_here.jpg', size)).toEqual(
      'xpto/name_here.jpg'
    );
  });
});
