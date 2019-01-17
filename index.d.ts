/*~ If this module has methods, declare them as functions like so.
 */
interface WithUpsertOptions {
  /**
   * @property {string} mutationName - optional rename of the default upsert function withXXXX to whatever you want
   *
   */
  mutationName: string;
  /**
   * @property {[queryNameStrings]} refetchQueries -
   *
   */
  refetchQueries: [queryNameStrings];
  /**
   * @property {boolean} showError - default=true -- whether or not to show a default error message on failure
   *
   */
  showError: boolean;
  /**
   * @property {obj | function} extraMutateArgs - obj or function that
   * returns obj to get passed to the actual mutation call
   *
   */
  extraMutateArgs: obj | function;
  /**
   * @property {[string]} invalidate - array of model types to invalidate after the mutate
   *
   */
  invalidate: [string];
  /**
   * @property {boolean} asFunction - if true, this gives you back a function you can call directly instead of a HOC
   *
   */
  asFunction: boolean;
  /**
   * @property {string} idAs - if not using a fragment, you get an id
   * field back as default. But, if the record doesn't have an id field,
   * and instead has a 'code', you can set idAs: 'code'
   *
   */
  idAs: string;
  /**
   *  * @property {boolean} forceCreate - sometimes the thing you're creating
   *  won't have an id field (it might have a code or something else as its primary key).
   * This lets you override the default behavior of updating if no id is found
   *
   */
  forceCreate: boolean;
  /**
   *  * @property {boolean} forceUpdate - sometimes the thing you're updating might have
   * an id field. This lets you override that. This lets you override the default behavior of creating if an id is found
   *
   */
  forceUpdate: boolean;
  /**
   *  * @property {boolean} excludeResults - don't fetch back result entities after update or create
   */
  excludeResults: boolean;
}

export function withUpsert(
  nameOrFragment: string,
  options: WithUpsertOptions
): string;


/**
 * Note all these options can be passed at Design Time or at Runtime (like reduxForm())
 */
interface WithTableParamsOptions {
  /**
   * @property {*string} formName - required unique identifier for the table
   */
  formName: string;
  /**
   * @property The data table schema or a function returning it. The function wll be called with props as the argument.
   */
  schema: Object | Function;
  /**
   * @property whether the table should connect to/update the URL
   */
  urlConnected: boolean;
  /**
   * @property whether or not to pass the selected entities
   */
  withSelectedEntities: boolean;
  /**
   * @property whether the model is keyed by code instead of id in the db
   */
  isCodeModel: boolean;
  /**
   * @property tableParam defaults such as pageSize, filter, etc
   */
  defaults: object;
  /**
   * @property won't console an error if an order is not found on schema
   */
  noOrderError: boolean;
}
export function withTableParams(options: WithTableParamsOptions): string;

// export function myOtherMethod(a: number): number;

// /*~ You can declare types that are available via importing the module */
// export interface SomeType {
//   name: string;
//   length: number;
//   extras?: string[];
// }

// /*~ You can declare properties of the module using const, let, or var */
// export const myField: number;

// /*~ If there are types, properties, or methods inside dotted names
//  *~ of the module, declare them inside a 'namespace'.
//  */
// export namespace subProp {
//   /*~ For example, given this definition, someone could write:
//      *~   import { subProp } from 'yourModule';
//      *~   subProp.foo();
//      *~ or
//      *~   import * as yourMod from 'yourModule';
//      *~   yourMod.subProp.foo();
//      */
//   export function foo(): void;
// }
