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
    return VectorFilterExpressionFactory.and(this, other);
  }

  /**
   * Creates an OR expression between this expression and another one.
   * @param other The other expression.
   * @returns The OR expression.
   */
  public or(other: VectorFilterExpression): VectorFilterOrExpression {
    return VectorFilterExpressionFactory.or(this, other);
  }

  /**
   * Negates this expression.
   * @returns The negated expression.
   */
  public not(): VectorFilterNotExpression {
    return VectorFilterExpressionFactory.not(this);
  }
}

/**
 * Factory for creating vector filter expressions.
 */
export class VectorFilterExpressionFactory {
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
   * Creates an {@link VectorFilterOrExpression} between a field and a value.
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
}

/**
 * Represents an AND expression between two vector filter expressions.
 */
export class VectorFilterAndExpression extends VectorFilterExpression {
  private readonly firstExpression: VectorFilterExpression;
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
  private readonly firstExpression: VectorFilterExpression;
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
  private readonly field: string;
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
