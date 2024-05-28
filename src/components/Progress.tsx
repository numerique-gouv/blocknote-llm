interface ProgressProps {
	percentage: number;
}

const Progress: React.FC<ProgressProps> = ({ percentage }) => {
	percentage = percentage * 100 ?? 0;
	return (
		<div className='progress-container'>
			<div
				className='progress-bar'
				style={{ width: `${percentage.toFixed(2)}%` }}
			>
				Placeholder
			</div>
		</div>
	);
};
export default Progress;
