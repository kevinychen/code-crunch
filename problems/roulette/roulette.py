from math import *

s = raw_input()
l = list(s)
c = sum(map(lambda x : x=='1', l))
other = 0
for i in range(len(l)):
    if l[i] == '0' and l[i - 1] == '1':
        other += 1
other = len(s) * other
c = c * (len(s) - c)

if other < c:
    print('shoot')
elif other > c:
    print('rotate')
else:
    print('either')
