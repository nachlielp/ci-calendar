import consolere from 'console-remote-client'

consolere.connect({
    server: 'https://console.re',
    channel: 'ci-calendar',
    redirectDefaultConsoleToRemote: true,
    disableDefaultConsoleOutput: false,
});

const log = (message: string) => {
    console.re.log(message);
};

export default log;