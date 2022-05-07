export interface ObjectArgs {
  targetObject: Record<string, any>;
  filterType: "include" | "exclude";
  filterKeys: string[];
}

export type ObjectTrim = (arg: ObjectArgs) => Record<string, any>;

export type FilterByObjectArgs = (args: ObjectArgs) => Record<string, any>;

export type FilterByRegularArgs = (
  targetObject: Record<string, any>,
  filterType: "include" | "exclude",
  filterKey: string | string[],
  ...filterKeys: string[]
) => Record<string, any>;
