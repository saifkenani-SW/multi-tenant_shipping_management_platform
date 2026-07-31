import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for every exception this package throws.
 *
 * These extend Nest's HttpException (not a plain Error and not this
 * app's custom ApiError) so that:
 *  - Dropped into an app with NO custom exception filter, they still
 *    produce sane HTTP status codes and a JSON body out of the box.
 *  - An app WITH its own global exception filter (e.g. one that
 *    localizes messages) can catch by `code` and rewrite the message
 *    however it wants, exactly like any other HttpException.
 */
export class StorageException extends HttpException {
  constructor(code: string, message: string, status: HttpStatus) {
    super({ code, message }, status);
  }
}

export class StorageWriteException extends StorageException {
  constructor(message = 'Failed to write file to storage') {
    super('STORAGE_WRITE_FAILED', message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class StorageNotFoundException extends StorageException {
  constructor(message = 'File not found in storage') {
    super('STORAGE_NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }
}

export class StorageDeleteException extends StorageException {
  constructor(message = 'Failed to delete file from storage') {
    super('STORAGE_DELETE_FAILED', message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
