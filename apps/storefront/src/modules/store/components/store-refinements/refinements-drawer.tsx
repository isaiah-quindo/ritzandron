"use client"

import { Dialog, Transition } from "@headlessui/react"
import { Adjustments, XMark } from "@medusajs/icons"
import React, { Fragment, useState } from "react"

type RefinementsDrawerProps = {
  title: string
  isOpen: boolean
  close: () => void
  children: React.ReactNode
}

const RefinementsDrawer = ({
  title,
  isOpen,
  close,
  children,
}: RefinementsDrawerProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[75]" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ui-bg-overlay backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel
                className="pointer-events-auto w-screen max-w-md"
                data-testid="refinements-drawer"
              >
                <div className="flex h-full flex-col border-l border-ui-border-base bg-ui-bg-base shadow-elevation-modal">
                  <div className="flex items-center justify-between border-b border-ui-border-base px-4 py-3">
                    <Dialog.Title className="text-large-semi text-ui-fg-base">
                      {title}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close filters"
                      className="text-ui-fg-muted hover:text-ui-fg-base"
                      data-testid="close-refinements-drawer"
                    >
                      <XMark />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">{children}</div>
                  <div className="border-t border-ui-border-base p-4">
                    <button
                      type="button"
                      onClick={close}
                      className="h-10 w-full rounded-rounded bg-ui-button-inverted text-ui-fg-on-inverted txt-compact-small-plus"
                      data-testid="apply-refinements"
                    >
                      Show results
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// Below `small` a refinements sidebar would push the products down, so it
// opens from a button in a drawer instead.
export const MobileRefinements = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="shrink-0 small:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="border-ui-border-base border h-10 rounded-rounded px-3 flex items-center gap-x-2 txt-compact-small-plus text-ui-fg-base"
        data-testid="open-refinements-drawer"
      >
        <Adjustments />
        {label}
      </button>
      <RefinementsDrawer
        title={label}
        isOpen={isOpen}
        close={() => setIsOpen(false)}
      >
        {children}
      </RefinementsDrawer>
    </div>
  )
}

export default RefinementsDrawer
