import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react"
import type { Story, Chapter } from "@/types/story"
import type { SerialCallback } from "@/app/hooks/useSerialCallback"

interface SaveConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  activeStory: Story | null
  handleConfirmFinalize: SerialCallback<[], void, false>
}

export const SaveConfirmationModal: React.FC<SaveConfirmationModalProps> = ({
  isOpen,
  onClose,
  activeStory,
  handleConfirmFinalize,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>
              <h2 className='text-lg font-semibold'>Finalize Story</h2>
            </ModalHeader>
            <ModalBody>
              <p>
                This will overwrite the original file&nbsp;
                {activeStory?.fileName}
                &nbsp; with the current chapter layout.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cancel
              </Button>
              <Button
                color='primary'
                onPress={handleConfirmFinalize}
                isLoading={handleConfirmFinalize.isBusy()}
              >
                Confirm And Save
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
