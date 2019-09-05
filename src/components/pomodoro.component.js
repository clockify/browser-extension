import * as React from 'react';
import {LocalStorageService} from '../services/localStorage-service';
import {isAppTypeExtension} from '../helpers/app-types-helper';
import {getLocalStorageEnums} from '../enums/local-storage.enum';
import {getKeyCodes} from '../enums/key-codes.enum';
import Switch from 'antd/lib/switch'
import {getBrowser} from "../helpers/browser-helper";
import {HtmlStyleHelper} from "../helpers/html-style-helper";

const localStorageService = new LocalStorageService();
const htmlStyleHelper = new HtmlStyleHelper();

class Pomodoro extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            enabled: false,
            timerInterval: null,
            shortBreak: null,
            longBreak: null,
            breakCounter: 0,
            isSoundNotification: false,
            isAutomaticStartStop: false,
            isLongBreakEnabled: false
        };
    }

    componentDidMount() {
        this.isPomodoroOn();
    }

    isPomodoroOn() {
        const userId = localStorageService.get('userId');
        const pomodoroFromStorageForUser = localStorageService.get('pomodoro') &&
            JSON.parse(localStorageService.get('pomodoro'))
                .filter(pomodoro => pomodoro.userId === userId).length > 0 ?
            JSON.parse(localStorageService.get('pomodoro'))
                .filter(pomodoro => pomodoro.userId === userId)[0] : null;

        if (!pomodoroFromStorageForUser) {
            return;
        }
        this.setState({
            enabled: pomodoroFromStorageForUser.enabled,
            timerInterval: pomodoroFromStorageForUser.timerInterval,
            shortBreak: pomodoroFromStorageForUser.shortBreak,
            longBreak: pomodoroFromStorageForUser.longBreak,
            isLongBreakEnabled: pomodoroFromStorageForUser.isLongBreakEnabled,
            breakCounter: pomodoroFromStorageForUser.breakCounter,
            isSoundNotification: pomodoroFromStorageForUser.isSoundNotification,
            isAutomaticStartStop: pomodoroFromStorageForUser.isAutomaticStartStop
        }, () => {
            if (this.state.enabled) {
                setTimeout(() => {
                    const pomodoroElem = document.getElementById('pomodoro');
                    if (this.state.enabled) {
                        pomodoroElem.style.maxHeight = pomodoroElem.scrollHeight + 'px';
                    } else {
                        pomodoroElem.style.maxHeight = '0';
                    }
                }, 150);
            }
            const elementsIds = ['longBreak', 'breakCounter'];
            htmlStyleHelper.enableDisableElements(pomodoroFromStorageForUser.isLongBreakEnabled, elementsIds);
        });
    }

    togglePomodoro() {
        const userId = localStorageService.get('userId');
        let pomodoroFromStorage = localStorageService.get('pomodoro') ?
            JSON.parse(localStorageService.get('pomodoro')) : [];
        let isEnabled;
        const pomodoroForCurrentUser = pomodoroFromStorage &&
            pomodoroFromStorage.filter(pomodoro => pomodoro.userId === userId).length > 0 ?
                pomodoroFromStorage.filter(pomodoro => pomodoro.userId === userId)[0] : null;

        const pomodoroElem = document.getElementById('pomodoro');
        const elementsIds = ['longBreak', 'breakCounter'];

        if (!pomodoroForCurrentUser) {
            pomodoroFromStorage = [
                ...pomodoroFromStorage,
                {
                    userId: userId,
                    enabled: true,
                    timerInterval: 5,
                    shortBreak: 5,
                    longBreak: 15,
                    isLongBreakEnabled: false,
                    breakCounter: 3,
                    isSoundNotification: false,
                    isAutomaticStartStop: false
                }
            ];

            this.setState({
                enabled: true,
                timerInterval: 5,
                shortBreak: 5,
                longBreak: 15,
                isLongBreakEnabled: false,
                breakCounter: 3,
                isSoundNotification: false,
                isAutomaticStartStop: false
            }, () => {
                htmlStyleHelper.enableDisableElements(false, elementsIds);
                pomodoroElem.style.maxHeight = pomodoroElem.scrollHeight + 'px'
            });

            isEnabled = true;
        } else {
            if (this.state.enabled) {
                pomodoroFromStorage = pomodoroFromStorage.map(pomodoro => {
                    if (pomodoro.userId === userId) {
                        pomodoro.enabled = false;
                        htmlStyleHelper.enableDisableElements(pomodoro.isLongBreakEnabled, elementsIds);
                    }

                    return pomodoro;
                });
                this.setState({
                    enabled: false
                }, () => pomodoroElem.style.maxHeight = '0');

                isEnabled = false;
            } else {
                pomodoroFromStorage = pomodoroFromStorage.map(pomodoro => {
                    if (pomodoro.userId === userId) {
                        pomodoro.enabled = true;
                        htmlStyleHelper.enableDisableElements(pomodoro.isLongBreakEnabled, elementsIds);
                    }

                    return pomodoro;
                });

                this.setState({
                    enabled: true
                }, () => pomodoroElem.style.maxHeight = pomodoroElem.scrollHeight + 'px');

                isEnabled = true;
            }
        }
        this.props.changeSaved();
        localStorageService.set(
            'pomodoro',
            JSON.stringify(pomodoroFromStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        if (isAppTypeExtension()) {
            if (isEnabled) {
                getBrowser().extension.getBackgroundPage().addPomodoroTimer();
            } else {
                getBrowser().extension.getBackgroundPage().restartPomodoro();
            }
        }
    }

    sendPomodoroRequest() {
        if (isAppTypeExtension()) {
            getBrowser().runtime.sendMessage({
                eventName: "pomodoroTimer"
            });
        }
    }

    changePomodoroProperty(event) {
        let value = parseInt(event.target.value);
        if (value === 0) {
            value = 1;
        }

        const userId = localStorageService.get('userId');
        const pomodoroToSaveInStorage =
            JSON.parse(localStorageService.get('pomodoro')).map(pomodoro => {
                if (pomodoro.userId === userId) {
                    pomodoro[event.target.id] = value ? value : pomodoro[event.target.id];

                    const obj = {};
                    obj[event.target.id] = pomodoro[event.target.id];
                    this.setState(obj);
                }
                return pomodoro;
            });

        localStorageService.set(
            'pomodoro',
            JSON.stringify(pomodoroToSaveInStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );
        this.props.changeSaved();
        if (isAppTypeExtension()) {
            getBrowser().extension.getBackgroundPage().addPomodoroTimer();
        }
    }

    changePomodoroPropertyOnEnter(event) {
        if (event.keyCode === getKeyCodes().enter) {
            this.changePomodoroProperty(event);
        }
    }

    changePomodoroPropertyState(event) {
        const obj = {};
        obj[event.target.id] = event.target.value;
        this.setState(obj);
    }

    changeIsSoundNotification(event) {
        const userId = localStorageService.get('userId');
        const pomodoroToSaveInStorage =
            JSON.parse(localStorageService.get('pomodoro')).map(pomodoro => {
                if (pomodoro.userId === userId) {
                    pomodoro.isSoundNotification = event;
                }
                return pomodoro;
            });

        localStorageService.set(
            'pomodoro',
            JSON.stringify(pomodoroToSaveInStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );
        this.props.changeSaved();
        this.setState({
            isSoundNotification: event
        });
    }

    changeIsAutomaticStartStop(event) {
        const userId = localStorageService.get('userId');
        const pomodoroToSaveInStorage =
            JSON.parse(localStorageService.get('pomodoro')).map(pomodoro => {
                if (pomodoro.userId === userId) {
                    pomodoro.isAutomaticStartStop = event;
                }
                return pomodoro;
            });

        localStorageService.set(
            'pomodoro',
            JSON.stringify(pomodoroToSaveInStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );
        this.props.changeSaved();
        this.setState({
            isAutomaticStartStop: event
        });
    }

    toggleLongBreakEnabled(event) {
        const userId = localStorageService.get('userId');
        const pomodoroToSaveInStorage =
            JSON.parse(localStorageService.get('pomodoro')).map(pomodoro => {
                if (pomodoro.userId === userId) {
                    pomodoro.isLongBreakEnabled = event;
                }
                return pomodoro;
            });

        localStorageService.set(
            'pomodoro',
            JSON.stringify(pomodoroToSaveInStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );
        this.props.changeSaved();

        this.setState({
            isLongBreakEnabled: event
        }, () => {
            const elementsIds = ['longBreak', 'breakCounter'];
            htmlStyleHelper.enableDisableElements(event, elementsIds);
        });
    }

    render() {
        return(
            <div>
                <div className={isAppTypeExtension() ? "pomodoro" : "disabled"}
                     onClick={this.togglePomodoro.bind(this)}>
                        <div className={this.state.enabled ?
                            "pomodoro__checkbox checked" : "pomodoro__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.enabled ?
                                     "pomodoro__checkbox--img" :
                                     "pomodoro__checkbox--img_hidden"}/>
                        </div>
                    <span className="pomodoro__title">Enable pomodoro timer</span>
                </div>
                <div id="pomodoro"
                     className="pomodoro__content expandContainer">
                    <div>
                        <div className="pomodoro__box__content">
                            <p>Timer interval</p>
                            <div className="pomodoro__box__content--right_side">
                                <input id="timerInterval"
                                       value={this.state.timerInterval}
                                       onBlur={this.changePomodoroProperty.bind(this)}
                                       onKeyDown={this.changePomodoroPropertyOnEnter.bind(this)}
                                       onChange={this.changePomodoroPropertyState.bind(this)}/>
                                <p>minutes</p>
                            </div>
                        </div>
                        <div className="pomodoro__box__content">
                            <p>Short break</p>
                            <div className="pomodoro__box__content--right_side">
                                <input id="shortBreak"
                                       value={this.state.shortBreak}
                                       onBlur={this.changePomodoroProperty.bind(this)}
                                       onKeyDown={this.changePomodoroPropertyOnEnter.bind(this)}
                                       onChange={this.changePomodoroPropertyState.bind(this)}/>
                                <p>minutes</p>
                            </div>
                        </div>
                        <div className="pomodoro__border"></div>
                        <div className="pomodoro__box__content">
                            <Switch className="pomodoro__switch"
                                    checked={this.state.isLongBreakEnabled}
                                    onChange={this.toggleLongBreakEnabled.bind(this)}/>
                            <p>Long break</p>
                            <div className="pomodoro__box__content--right_side">
                                <input id="longBreak"
                                       value={this.state.longBreak}
                                       onBlur={this.changePomodoroProperty.bind(this)}
                                       onKeyDown={this.changePomodoroPropertyOnEnter.bind(this)}
                                       onChange={this.changePomodoroPropertyState.bind(this)}/>
                                <p>minutes</p>
                            </div>
                        </div>
                        <div className="pomodoro__box__content">
                            <p>Long break starts after</p>
                            <div className="pomodoro__box__content--right_side">
                                <input id="breakCounter"
                                       value={this.state.breakCounter}
                                       onBlur={this.changePomodoroProperty.bind(this)}
                                       onKeyDown={this.changePomodoroPropertyOnEnter.bind(this)}
                                       onChange={this.changePomodoroPropertyState.bind(this)}/>
                                <p>breaks</p>
                            </div>
                        </div>
                        <div className="pomodoro__border"></div>
                        <div className="pomodoro__box__content">
                            <p>Sound notification</p>
                            <Switch className="pomodoro__switch"
                                    checked={this.state.isSoundNotification}
                                    onChange={this.changeIsSoundNotification.bind(this)}/>
                        </div>
                        <div className="pomodoro__border"></div>
                        <div className="pomodoro__box__content">
                            <p>Automatic breaks</p>
                            <Switch className="pomodoro__switch"
                                    checked={this.state.isAutomaticStartStop}
                                    onChange={this.changeIsAutomaticStartStop.bind(this)}/>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Pomodoro;