export enum OrganizationUnitAction {
  View = 'view',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  /** تعديل التغطية الجغرافية — يغيّر توجيه الشحنات، ففعل منفصل. */
  ManageCoverage = 'manage-coverage',
}
