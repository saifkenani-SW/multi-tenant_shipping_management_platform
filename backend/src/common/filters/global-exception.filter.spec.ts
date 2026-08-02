import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter translations', () => {
  const filter = new GlobalExceptionFilter({} as any);

  it('preserves specific business error messages', () => {
    const translate = (filter as any).translateHttpError.bind(filter);

    expect(
      translate(
        400,
        'No pending OTP request found for this email. Start the flow again',
      ),
    ).toBeNull();
  });
});
