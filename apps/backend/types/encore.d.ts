declare module "encore.dev/api" {
  export interface APIRequest {
    header(name: string): string | undefined;
    [key: string]: unknown;
  }

  export interface APIContext {
    req?: APIRequest;
    [key: string]: unknown;
  }

  export function api<
    Params extends object | void = void,
    Response extends object | void = void
  >(
    options: APIOptions,
    fn: (params: Params, ctx: APIContext) => Promise<Response>
  ): (params: Params) => Promise<Response>;

  export function api<
    Params extends object | void = void,
    Response extends object | void = void
  >(
    options: APIOptions,
    fn: (params: Params, ctx: APIContext) => Response
  ): (params: Params) => Promise<Response>;
}
