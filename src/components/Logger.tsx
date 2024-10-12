import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

export const Logger = () => {
	const [lines, setLines] = useState([]);
	const [isOpen, setIsOpen] = useState(false);
	const [counter, setCounter] = useState(0);

	const logEndRef = useRef(null);

	useEffect(() => {
		log('DebugInfo did mount');
		log('navigator.onLine: ' + navigator.onLine ? 'online' : 'offline');

		return () => log('DebugInfo Will Unmount');
	}, []);

	const log = (text: string): void => {
		if (lines.length > 0 && lines[lines.length - 1].text === text.trim()) {
			const last = lines.length - 1;
			const arr = lines.map((line, index) =>
				index === last
					? Object.assign(line, { counter: counter + 1 })
					: line
			);
			setLines(arr);
		} else {
			setLines([...lines, { txt: text.trim(), counter: 1 }]);
		}

		logEndRef.current.scrollIntoView({ behavior: 'smooth' });
	};

	return (
		<div className="debug-info">
			<div>
				<button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Close' : 'Open'}</button>
			</div>

			{isOpen && (
				<div className="debug-info-log">
					{lines.map((line, index) => (
						<div key={index}>
							{line.txt} {line.counter > 1 ? '-> ' + line.counter : ''}
						</div>
					))}
				</div>
			)}
			<div ref={logEndRef} />
		</div>
	);
};