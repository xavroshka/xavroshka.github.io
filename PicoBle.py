# Needs  Neopixel strip on GP15
# Modified from Official Rasp Pi example here:
# https://github.com/micropython/micropython/tree/master/examples/bluetooth
import bluetooth
import random
import struct
import time
from ble_advertising import advertising_payload
from micropython import const

# Neopixel additional material ############
from machine import Pin, ADC
from neopixel import NeoPixel

strip = NeoPixel(Pin(15), 180)


#   End of LED additional material  #########

_IRQ_CENTRAL_CONNECT = const(1)
_IRQ_CENTRAL_DISCONNECT = const(2)
_IRQ_GATTS_WRITE = const(3)

_FLAG_READ = const(0x0002)
_FLAG_WRITE_NO_RESPONSE = const(0x0004)
_FLAG_WRITE = const(0x0008)
_FLAG_NOTIFY = const(0x0010)

_UART_UUID = bluetooth.UUID("0000ffe0-0000-1000-8000-00805f9b34fb")
_UART_TX = (
    bluetooth.UUID("0000ffe0-0000-1000-8000-00805f9b34fb"),
    _FLAG_READ | _FLAG_NOTIFY,
)
_UART_RX = (
    bluetooth.UUID("0000ffe1-0000-1000-8000-00805f9b34fb"),
    _FLAG_WRITE | _FLAG_WRITE_NO_RESPONSE,
)
_UART_SERVICE = (
    _UART_UUID,
    (_UART_TX, _UART_RX),
)


class BLESimplePeripheral:
    def __init__(self, ble, name="PicoW"):
        self._ble = ble
        self._ble.active(True)
        self._ble.irq(self._irq)
        ((self._handle_tx, self._handle_rx),) = self._ble.gatts_register_services((_UART_SERVICE,))
        self._connections = set()
        self._write_callback = None
        self._payload = advertising_payload(name=name, services=[_UART_UUID])
        self._advertise()

    def _irq(self, event, data):
        # Track connections so we can send notifications.
        if event == _IRQ_CENTRAL_CONNECT:
            conn_handle, _, _ = data
            print("New connection", conn_handle)
            self._connections.add(conn_handle)
        elif event == _IRQ_CENTRAL_DISCONNECT:
            conn_handle, _, _ = data
            print("Disconnected", conn_handle)
            self._connections.remove(conn_handle)
            # Start advertising again to allow a new connection.
            self._advertise()
        elif event == _IRQ_GATTS_WRITE:
            conn_handle, value_handle = data
            value = self._ble.gatts_read(value_handle)
            if value_handle == self._handle_rx and self._write_callback:
                self._write_callback(value)

    def send(self, data):
        for conn_handle in self._connections:
            self._ble.gatts_notify(conn_handle, self._handle_tx, data)

    def is_connected(self):
        return len(self._connections) > 0

    def _advertise(self, interval_us=500000):
        print("Starting advertising")
        self._ble.gap_advertise(interval_us, adv_data=self._payload)

    def on_write(self, callback):
        self._write_callback = callback

# This is the MAIN LOOP
def demo():    # This part modified to control Neopixel strip
    ble = bluetooth.BLE()
    p = BLESimplePeripheral(ble)

    def on_rx(v):  # v is what has been received
        print(v)
        
        ss = str(v)
        ss = ss.replace(ss[:6], '')
        ss = ss[:-4]
        p = ss.split(',')
        
        r = int(p[0])
        g = int(p[1])
        b = int(p[2])
        
        print (p)
        
        for i in range(180):
            strip[i] = (r,g,b) # Mixed pixel
            strip.write()            
        
    p.on_write(on_rx)


if __name__ == "__main__":
    demo()

