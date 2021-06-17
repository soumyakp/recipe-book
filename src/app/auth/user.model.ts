export class User {
  constructor(
    public email: string | null,
    public id: string | null,
    private _token: string | null,
    private _tokenExpirationDate: Date | null
  ) {}

  get token() {
    if (!this._tokenExpirationDate || new Date() > this._tokenExpirationDate) {
      return null;
    }
    return this._token;
  }
}
