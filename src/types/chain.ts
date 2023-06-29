import type { Chain as Chain_ } from '@wagmi/chains'
import type { Address } from 'abitype'

import type { Formatters } from './formatter.js'
import type { Serializers } from './serializer.js'
import type { IsUndefined, MaybeNullable } from './utils.js'

export type Chain<
  TFormatters extends Formatters | undefined = Formatters | undefined,
  TSerializers extends Serializers<TFormatters> | undefined =
    | Serializers<TFormatters>
    | undefined,
> = Chain_ & {
  formatters?: TFormatters
  serializers?: TSerializers
}

export type ChainContract = {
  address: Address
  blockCreated?: number
}

export type GetChain<
  TChain extends Chain | undefined,
  TChainOverride extends Chain | undefined = undefined,
  TConfig extends { Nullable: boolean } = { Nullable: true },
> = IsUndefined<TChain> extends true
  ? { chain: MaybeNullable<TChainOverride, TConfig['Nullable']> }
  : { chain?: MaybeNullable<TChainOverride, TConfig['Nullable']> }
