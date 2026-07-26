import { MongoAbility, Subject } from '@casl/ability';

export type AppAbility<
  TAction extends string = string,
  TSubject extends Subject = Subject,
> = MongoAbility<[TAction, TSubject]>;
