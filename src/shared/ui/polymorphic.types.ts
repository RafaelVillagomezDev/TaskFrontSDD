import type { ComponentPropsWithRef, ElementType } from 'react';

// Props de un componente polimórfico (CONSTITUTION.md VI.3): sus props propias, la prop `as` y las del elemento
// elegido, sin aserciones de tipo (plan R-5)
export type PolymorphicProps<E extends ElementType, OwnProps> = OwnProps & { as?: E } & Omit<
    ComponentPropsWithRef<E>,
    keyof OwnProps | 'as'
  >;
