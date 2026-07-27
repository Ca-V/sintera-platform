// @sintera/types — IDs tipados (branded) — contratos opcionais. Impedem trocar um id de domínio por outro
// em tempo de compilação. Só tipos; a adoção nos DTOs é incremental (não força churn agora).
export type Id<Brand extends string> = string & { readonly __brand: Brand }

export type UserId = Id<'User'>
export type ExamId = Id<'Exam'>
export type ProfileId = UserId   // o perfil é a linha da própria pessoa
