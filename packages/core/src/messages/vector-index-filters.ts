/**
 * Base class for all vector index filter expressions.
 */
export abstract class VectorFilterExpression {
  public abstract toString(): string;

  /**
   * Creates an AND expression between this expression and another one.
   * @param other The other expression.
   * @returns The AND expression.
   */
  public and(other: VectorFilterExpression): VectorFilterAndExpression {
    return VectorFilterExpressions.and(this, other);
  }

  /**
   * Creates an OR expression between this expression and another one.
   * @param other The other expression.
   * @returns The OR expression.
   */
  public or(other: VectorFilterExpression): VectorFilterOrExpression {
    return VectorFilterExpressions.or(this, other);
  }

  /**
   * Negates this expression.
   * @returns The negated expression.
   */
  public not(): VectorFilterNotExpression {
    return VectorFilterExpressions.not(this);
  }
}

/**
 * Factory for creating vector filter expressions.
 */
export class VectorFilterExpressions {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Creates an {@link VectorFilterAndExpression} between two vector filter expressions.
   * @param firstExpression The first expression.
   * @param secondExpression The second expression.
   * @returns The AND expression.
   */
  public static and(
    firstExpression: VectorFilterExpression,
    secondExpression: VectorFilterExpression
  ): VectorFilterAndExpression {
    return new VectorFilterAndExpression(firstExpression, secondExpression);
  }

  /**
   * Creates an {@link VectorFilterOrExpression} between two vector filter expressions.
   * @param firstExpression The first expression.
   * @param secondExpression The second expression.
   * @returns The OR expression.
   */
  public static or(
    firstExpression: VectorFilterExpression,
    secondExpression: VectorFilterExpression
  ): VectorFilterOrExpression {
    return new VectorFilterOrExpression(firstExpression, secondExpression);
  }

  /**
   * Creates a {@link VectorFilterNotExpression} expression of a vector filter expression.
   * @param expression The expression.
   * @returns The NOT expression.
   */
  public static not(
    expression: VectorFilterExpression
  ): VectorFilterNotExpression {
    return new VectorFilterNotExpression(expression);
  }

  /**
   * Creates a {@link VectorFilterEqualsExpression} between a field and a value.
   * @param field The field.
   * @param value The value.
   * @returns The equals expression.
   */
  public static equals(
    field: string,
    value: string | number | boolean
  ): VectorFilterEqualsExpression {
    return new VectorFilterEqualsExpression(field, value);
  }

  /**
   * Creates a {@link VectorFilterGreaterThanExpression} between a field and a value.
   * @param field The field.
   * @param value The value.
   * @returns The greater than expression.
   */
  public static greaterThan(
    field: string,
    value: number
  ): VectorFilterGreaterThanExpression {
    return new VectorFilterGreaterThanExpression(field, value);
  }

  /**
   * Creates a {@link VectorFilterGreaterThanOrEqualExpression} between a field and a value.
   * @param field The field.
   * @param value The value.
   * @returns The greater than or equal expression.
   */
  public static greaterThanOrEqual(
    field: string,
    value: number
  ): VectorFilterGreaterThanOrEqualExpression {
    return new VectorFilterGreaterThanOrEqualExpression(field, value);
  }

  /**
   * Creates a {@link VectorFilterLessThanExpression} between a field and a value.
   * @param field The field.
   * @param value The value.
   * @returns The less than expression.
   */
  public static lessThan(
    field: string,
    value: number
  ): VectorFilterLessThanExpression {
    return new VectorFilterLessThanExpression(field, value);
  }

  /**
   * Creates a {@link VectorFilterLessThanOrEqualExpression} between a field and a value.
   * @param field The field.
   * @param value The value.
   * @returns The less than or equal expression.
   */
  public static lessThanOrEqual(
    field: string,
    value: number
  ): VectorFilterLessThanOrEqualExpression {
    return new VectorFilterLessThanOrEqualExpression(field, value);
  }

  /**
   * Creates a {@link VectorFilterListContainsExpression} between a list-valued field and a value.
   * @param field The field.
   * @param value The value.
   * @returns The contains expression.
   */
  public static listContains(
    field: string,
    value: string
  ): VectorFilterListContainsExpression {
    return new VectorFilterListContainsExpression(field, value);
  }

  /**
   * Creates a {@link VectorFilterIdInSetExpression} for a set of ids.
   * @param ids The ids.
   */
  public static idInSet(ids: string[]): VectorFilterIdInSetExpression {
    return new VectorFilterIdInSetExpression(ids);
  }
}

/**
 * Represents an AND expression between two vector filter expressions.
 */
export class VectorFilterAndExpression extends VectorFilterExpression {
  /**
   * The first expression to AND.
   * @private
   */
  private readonly firstExpression: VectorFilterExpression;
  /**
   * The second expression to AND.
   * @private
   */
  private readonly secondExpression: VectorFilterExpression;

  constructor(
    firstExpression: VectorFilterExpression,
    secondExpression: VectorFilterExpression
  ) {
    super();
    this.firstExpression = firstExpression;
    this.secondExpression = secondExpression;
  }

  public get FirstExpression(): VectorFilterExpression {
    return this.firstExpression;
  }

  public get SecondExpression(): VectorFilterExpression {
    return this.secondExpression;
  }

  public override toString(): string {
    return `(${this.firstExpression.toString()} AND ${this.secondExpression.toString()})`;
  }
}

/**
 * Represents an OR expression between two vector filter expressions.
 */
export class VectorFilterOrExpression extends VectorFilterExpression {
  /**
   * The first expression to OR.
   * @private
   */
  private readonly firstExpression: VectorFilterExpression;
  /**
   * The second expression to OR.
   * @private
   */
  private readonly secondExpression: VectorFilterExpression;

  constructor(
    firstExpression: VectorFilterExpression,
    secondExpression: VectorFilterExpression
  ) {
    super();
    this.firstExpression = firstExpression;
    this.secondExpression = secondExpression;
  }

  public get FirstExpression(): VectorFilterExpression {
    return this.firstExpression;
  }

  public get SecondExpression(): VectorFilterExpression {
    return this.secondExpression;
  }

  public override toString(): string {
    return `(${this.firstExpression.toString()} OR ${this.secondExpression.toString()})`;
  }
}

/**
 * Represents a NOT expression of a vector filter expression.
 */
export class VectorFilterNotExpression extends VectorFilterExpression {
  /**
   * The expression to negate.
   * @private
   */
  private readonly expression: VectorFilterExpression;

  constructor(expression: VectorFilterExpression) {
    super();
    this.expression = expression;
  }

  public get Expression(): VectorFilterExpression {
    return this.expression;
  }

  public override toString(): string {
    return `NOT ${this.expression.toString()}`;
  }
}

/**
 * Represents an equals expression between a field and a value.
 */
export class VectorFilterEqualsExpression extends VectorFilterExpression {
  /**
   * The field to compare.
   * @private
   */
  private readonly field: string;
  /**
   * The value to test for equality.
   * @private
   */
  private readonly value: string | number | boolean;

  constructor(field: string, value: string | number | boolean) {
    super();
    this.field = field;
    this.value = value;
  }

  public get Field(): string {
    return this.field;
  }

  public get Value(): string | number | boolean {
    return this.value;
  }

  public override toString(): string {
    return `${this.field}=${this.value.toString()}`;
  }
}

/**
 * Represents a greater than expression between a field and a value.
 */
export class VectorFilterGreaterThanExpression extends VectorFilterExpression {
  /**
   * The field to compare.
   * @private
   */
  private readonly field: string;
  /**
   * The value to test for greater than.
   * @private
   */
  private readonly value: number;

  constructor(field: string, value: number) {
    super();
    this.field = field;
    this.value = value;
  }

  public get Field(): string {
    return this.field;
  }

  public get Value(): number {
    return this.value;
  }

  public override toString(): string {
    return `${this.field} > ${this.value.toString()}`;
  }
}

/**
 * Represents a greater than or equal expression between a field and a value.
 */
export class VectorFilterGreaterThanOrEqualExpression extends VectorFilterExpression {
  /**
   * The field to compare.
   * @private
   */
  private readonly field: string;
  /**
   * The value to test for greater than or equal.
   * @private
   */
  private readonly value: number;

  constructor(field: string, value: number) {
    super();
    this.field = field;
    this.value = value;
  }

  public get Field(): string {
    return this.field;
  }

  public get Value(): number {
    return this.value;
  }

  public override toString(): string {
    return `${this.field} >= ${this.value.toString()}`;
  }
}

/**
 * Represents a less than expression between a field and a value.
 */
export class VectorFilterLessThanExpression extends VectorFilterExpression {
  /**
   * The field to compare.
   * @private
   */
  private readonly field: string;
  /**
   * The value to test for less than.
   * @private
   */
  private readonly value: number;

  constructor(field: string, value: number) {
    super();
    this.field = field;
    this.value = value;
  }

  public get Field(): string {
    return this.field;
  }

  public get Value(): number {
    return this.value;
  }

  public override toString(): string {
    return `${this.field} < ${this.value.toString()}`;
  }
}

/**
 * Represents a less than or equal expression between a field and a value.
 */
export class VectorFilterLessThanOrEqualExpression extends VectorFilterExpression {
  /**
   * The field to compare.
   * @private
   */
  private readonly field: string;
  /**
   * The value to test for less than or equal.
   * @private
   */
  private readonly value: number;

  constructor(field: string, value: number) {
    super();
    this.field = field;
    this.value = value;
  }

  public get Field(): string {
    return this.field;
  }

  public get Value(): number {
    return this.value;
  }

  public override toString(): string {
    return `${this.field} <= ${this.value.toString()}`;
  }
}

/**
 * Represents a contains expression between a list-valued field and a value.
 */
export class VectorFilterListContainsExpression extends VectorFilterExpression {
  /**
   * The field to compare.
   * @private
   */
  private readonly field: string;
  /**
   * The value to test for containment, ie does the list contain this value.
   * @private
   */
  private readonly value: string;

  constructor(field: string, value: string) {
    super();
    this.field = field;
    this.value = value;
  }

  public get Field(): string {
    return this.field;
  }

  public get Value(): string {
    return this.value;
  }

  public override toString(): string {
    return `${this.field} contains ${this.value.toString()}`;
  }
}

/**
 * Represents an id in set expression.
 * An item is considered a match if its id is in the set of ids.
 */
export class VectorFilterIdInSetExpression extends VectorFilterExpression {
  /**
   * The ids to test for membership.
   * @private
   */
  private readonly ids: string[];

  constructor(ids: string[]) {
    super();
    this.ids = ids;
  }

  /**
   * The ids to test for membership.
   * @constructor
   */
  public get Ids(): string[] {
    return this.ids;
  }

  public override toString(): string {
    return `id in [${this.ids.join(', ')}]`;
  }
}
