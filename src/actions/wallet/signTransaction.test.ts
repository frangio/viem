import { describe, expect, test } from 'vitest'

import { accounts } from '../../_test/constants.js'
import { walletClient } from '../../_test/utils.js'
import type {
  TransactionSerializable,
  TransactionSerializableBase,
} from '../../index.js'
import { signTransaction } from './signTransaction.js'

const sourceAccount = accounts[0]

const base = {
  gas: 21000n,
  nonce: 785,
} satisfies TransactionSerializableBase

describe('eip1559', () => {
  const baseEip1559 = {
    ...base,
    type: 'eip1559',
  } as const satisfies TransactionSerializable

  test('default (json-rpc)', async () => {
    expect(
      await signTransaction(walletClient, {
        account: sourceAccount.address,
        ...baseEip1559,
      }),
    ).toBeDefined()
  })
})
