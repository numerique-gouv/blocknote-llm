interface ProgressProps {
	text: string;
	percentage?: number;
}

export default function Progress({ text, percentage }: ProgressProps) {
	percentage = percentage ?? 0;
	return (
		<div className='progress-container'>
			<div className='progress-bar' style={{ width: `${percentage}%` }}>
				{text} ({`${percentage.toFixed(2)}%`})
			</div>
		</div>
	);
}
