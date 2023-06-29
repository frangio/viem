import type { Account, LocalAccount } from '../../accounts/types.js'
import { parseAccount } from '../../accounts/utils/parseAccount.js'
import type { WalletClient } from '../../clients/createWalletClient.js'
import type { Transport } from '../../clients/transports/createTransport.js'
import { AccountNotFoundError } from '../../errors/account.js'
import {
  type FormattedTransactionRequest,
  type RpcTransactionRequest,
  type SerializeTransactionFn,
  formatTransactionRequest,
} from '../../index.js'
import type { GetAccountParameter } from '../../types/account.js'
import type { Chain, GetChain } from '../../types/chain.js'
import type {
  TransactionRequest,
  TransactionSerializable,
  TransactionSerialized,
  TransactionType,
} from '../../types/transaction.js'
import type { UnionOmit } from '../../types/utils.js'
import { assertCurrentChain } from '../../utils/chain.js'
import { extract, numberToHex } from '../../utils/index.js'
import { assertRequest } from '../../utils/transaction/assertRequest.js'
import type { GetTransactionType } from '../../utils/transaction/getTransactionType.js'
import { getChainId } from '../public/getChainId.js'

type GetSerializer<
  TAccount extends Account | undefined = Account | undefined,
  TTransactionSerializable extends TransactionSerializable = TransactionSerializable,
> = TAccount extends LocalAccount
  ? { serializer?: SerializeTransactionFn<TTransactionSerializable> }
  : { serializer?: undefined }

export type SignTransactionParameters<
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined,
  TTransactionSerializable extends TransactionSerializable = TransactionSerializable,
  TChainOverride extends Chain | undefined = Chain,
> = UnionOmit<FormattedTransactionRequest<TChainOverride | TChain>, 'from'> &
  GetAccountParameter<TAccount> &
  GetSerializer<TAccount, TTransactionSerializable> &
  (
    | (GetChain<TChain, TChainOverride, { Nullable: false }> & {
        chainId?: never
      })
    | {
        chainId: number
        chain?: never
      }
  )

export type SignTransactionReturnType<
  TTransactionSerializable extends TransactionSerializable = TransactionSerializable,
  TTransactionType extends TransactionType = GetTransactionType<TTransactionSerializable>,
> = TransactionSerialized<TTransactionType>

export async function signTransaction<
  TChain extends Chain | undefined,
  TAccount extends Account | undefined,
  TTransactionSerializable extends TransactionSerializable,
  TChainOverride extends Chain | undefined,
>(
  client: WalletClient<Transport, TChain, TAccount>,
  args: SignTransactionParameters<
    TChain,
    TAccount,
    TTransactionSerializable,
    TChainOverride
  >,
): Promise<SignTransactionReturnType<TTransactionSerializable>> {
  const {
    account: account_ = client.account,
    chain = client.chain,
    ...transaction
  } = args
  const {
    accessList,
    data,
    gas,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    to,
    value,
    ...rest
  } = transaction

  if (!account_)
    throw new AccountNotFoundError({
      docsPath: '/docs/actions/wallet/signMessage',
    })
  const account = parseAccount(account_)

  assertRequest({
    account,
    ...args,
  })

  const chainId = await getChainId(client)
  assertCurrentChain({
    currentChainId: chainId,
    chain,
  })

  if (account.type === 'local')
    return account.signTransaction({
      chainId,
      ...transaction,
    } as unknown as TTransactionSerializable) as Promise<
      SignTransactionReturnType<TTransactionSerializable>
    >

  const format =
    chain?.formatters?.transactionRequest?.format || formatTransactionRequest
  const request = format({
    // Pick out extra data that might exist on the chain's transaction request type.
    ...extract(rest, { format }),
    accessList,
    data,
    from: account.address,
    gas,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    to,
    value,
  } as TransactionRequest)
  return await client.request({
    method: 'eth_signTransaction',
    params: [
      {
        chainId: numberToHex(chainId),
        ...request,
      } as unknown as RpcTransactionRequest,
    ],
  })
}
