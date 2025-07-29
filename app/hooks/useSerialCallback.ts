import { useMemoizedFn, useUpdate } from "ahooks"
import { useCallback, useRef } from "react"

type Fn<P extends unknown[], V, K extends boolean> = (
  ...args: P
) => K extends true ? Promise<V> : Promise<V | undefined>

interface UseSerialCallbackOptions<K extends boolean> {
  returnLastResultOnBusy?: K

  triggerReRenderOnBusyStatusChange?: boolean
}

export interface SerialCallback<P extends unknown[], V, K extends boolean>
  extends Fn<P, V, K> {
  isBusy: () => boolean
}

export function useSerialCallback<
  P extends unknown[] = unknown[],
  V = unknown,
  K extends boolean = false
>(
  fn: (...args: P) => Promise<V>,
  options: UseSerialCallbackOptions<K> = {}
): SerialCallback<P, V, K> {
  const {
    returnLastResultOnBusy = false,
    triggerReRenderOnBusyStatusChange = true,
  } = options
  const isBusyRef = useRef(false)
  const update = useUpdate()

  const lastResult = useRef<V | undefined>(undefined)

  const cb = useMemoizedFn(async (...args: P) => {
    if (isBusyRef.current) {
      return returnLastResultOnBusy ? lastResult.current : undefined
    }
    isBusyRef.current = true
    if (triggerReRenderOnBusyStatusChange) {
      update()
    }
    try {
      const result = await fn(...args)
      lastResult.current = result
      return result
    } finally {
      isBusyRef.current = false
      if (triggerReRenderOnBusyStatusChange) {
        update()
      }
    }
  })

  return useCallback(
    Object.assign(cb, { isBusy: () => isBusyRef.current }) as SerialCallback<
      P,
      V,
      K
    >,
    []
  )
}
