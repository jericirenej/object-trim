export type ValidTypes = "include" | "exclude";
export interface ObjectArgs {
  targetObject: Record<string, any>;
  filterType: ValidTypes;
  filterKeys: string|string[];
}

export type ObjectTrim = (arg: ObjectArgs) => Record<string, any>;
