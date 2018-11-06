# client

import socket

address = ('111.231.231.145', 3000)
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

s.connect(address)


s.send('hihi\r\n')
reply = s.recv(128)
print reply
s.close()


