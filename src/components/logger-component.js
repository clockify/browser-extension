import * as React from 'react';

class Logger extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			lines: [],
			isOpen: true,
		};

		this.logEnd = React.createRef();

		this.log = this.log.bind(this);
		this.toggle = this.toggle.bind(this);
	}

	componentDidMount() {
		this.log('DebugInfo did mount');
		this.log('navigator.onLine: ' + navigator.onLine ? 'online' : 'offline');
	}

	componentWillUnmount() {
		this.log('DebugInfo Will Unmount');
	}

	toggle() {
		this.setState({ isOpen: !this.state.isOpen });
	}

	log(txt) {
		const { lines } = this.state;
		if (lines.length > 0 && lines[lines.length - 1].txt === txt.trim()) {
			const last = lines.length - 1;
			const arr = lines.map((line, index) =>
				index === last
					? Object.assign(line, { counter: line.counter + 1 })
					: line
			);
			this.setState({ lines: arr });
		} else
			this.setState({ lines: [...lines, { txt: txt.trim(), counter: 1 }] });

		this.logEnd.current.scrollIntoView({ behavior: 'smooth' });
	}

	render() {
		const { isOpen, lines } = this.state;
		return (
			<div className="debug-info">
				<div>
					<button onClick={this.toggle}>{isOpen ? 'Close' : 'Open'}</button>
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
				<div ref={this.logEnd} />
			</div>
		);
	}
}

export default Logger;
