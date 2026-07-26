export interface AuthorizationContext<TPrincipal = unknown> {
  readonly principal: TPrincipal;
}
