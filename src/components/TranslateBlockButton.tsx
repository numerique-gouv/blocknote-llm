import { Block } from '@blocknote/core';
import { SideMenuButton, SideMenuProps } from '@blocknote/react';
import { SiGoogletranslate } from 'react-icons/si';
import { transformateurJsonToString } from '../utils/ParserBlockToString';

interface TranslateBlockButtonProps extends SideMenuProps {
	worker: React.MutableRefObject<Worker | null>;
}

const TranslateBlockButton: React.FC<TranslateBlockButtonProps> = (props) => {
	const { worker } = props;

	const translate = () => {
		worker.current?.postMessage({
			text: transformateurJsonToString(props.block),
			id: props.block.id,
		});
	};

	return (
		<SideMenuButton>
			<SiGoogletranslate size={24} onClick={translate} />
		</SideMenuButton>
	);
};
export default TranslateBlockButton;
