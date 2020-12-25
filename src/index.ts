interface MessageItem {
    cmd: string;
    cb: Function;
}

class Socket {
    private socketDomain: string
    private messageArr: MessageItem[]
    private messageAll: Record<string, Function>
    private SocketTask: WebSocket | null
    private isConnectedSocket: Boolean
    private reConnectTimer: number | null

    // private max: number
    // private pool: NodeWorker[]
    // private idlePool: NodeWorker[]
    // private queue: [(worker: NodeWorker) => void, (err: Error) => void][]
    constructor(domain: string) {
        this.socketDomain = domain
        this.messageArr = [] // 单个监听事件数据
        this.messageAll = {}
        this.SocketTask = null
        this.isConnectedSocket = false // socket是否已连接
        this.reConnectTimer = null // 断线重连计时器
    }

    // 初始化socket
    initSocket() {
        this.SocketTask = this.connectSocket() // 连接
        this.listenConnectError() // 连接异常
        this.listenConnectSuccess() // 连接成功
        this.listenMessageBack() // 监听消息
        this.listenSocketClose() // 监听断开
    }

    // 连接socket
    connectSocket(): WebSocket {
        return new WebSocket(this.socketDomain)
    }

    // 监听连接成功
    listenConnectSuccess() {
        (this.SocketTask as WebSocket).onopen = () => {
            this.isConnectedSocket = true
            this.clearAllTimer()
        }
    }

    // 监听连接断开
    listenSocketClose() {
        (this.SocketTask as WebSocket).onclose = () => {
            console.log('socket close');
            this.clearAllTimer()

            if (this.isConnectedSocket) {
                (this.SocketTask as WebSocket).close()
                this.reConnectTimer = window.setInterval(() => {
                    this.initSocket()
                }, 5000)
            }
        }
    }

    // 监听连接异常
    listenConnectError() {
        (this.SocketTask as WebSocket).onerror = res => {
            console.log(JSON.stringify(res))
        }
    }

    // 发送socket消息
    sendSocketMessage(obj: any) {
        try {
            (this.SocketTask as WebSocket).send(JSON.stringify(obj))
        } catch (error) {
        }
    }

    // 监听socket收到的消息，执行相应的回调函数
    listenMessageBack() {
        (this.SocketTask as WebSocket).onmessage = ({ data }) => {
            // console.log('==========', JSON.parse(data))
            data = JSON.parse(data)
            let cmd = data.cmd
            this.messageAll.cb && this.messageAll.cb(data)
            for (const item of this.messageArr) {
                if (item.cmd === cmd) {
                    return item.cb(data.msg)
                }
            }
        }
    }
    // 订阅要监听的消息的事件和回调函数
    addListener(cmd: string, cb: Function) {
        this.messageArr.push({
            cmd,
            cb
        })
        // console.log('this.messageArr---', this.messageArr)
    }

    // 监听所有事件
    listenAll(cb: Function) {
        this.messageAll = { cb }
    }

    // 取消订阅，移出监听数组
    removeListener(cmd: string) {
        this.messageArr = this.messageArr.filter(item => item.cmd !== cmd)
    }

    // 所有移出监听数组
    removeAllListener() {
        this.messageArr = []
    }

    // 手动关闭连接
    closeSocket() {
        if (this.isConnectedSocket) {
            (this.SocketTask as WebSocket).close()
            this.isConnectedSocket = false
        }
    }

    // 清理所有计时器
    clearAllTimer() {
        if (this.reConnectTimer) {
            clearInterval(this.reConnectTimer)
            this.reConnectTimer = null
        }
    }

}