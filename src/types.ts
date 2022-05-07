export type ValidTypes = "include" | "exclude";
export interface ObjectArgs {
  targetObject: Record<string,any>;
  filterType?: ValidTypes;
  filters: string | string[];
  recursive?: boolean;
}

export type ObjectTrim = (arg: ObjectArgs) => Record<string, any>;
