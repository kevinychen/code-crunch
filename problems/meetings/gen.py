import random

def getStartEnd():
    s = random.randint(0, 1000)
    return (s, s + random.randint(1, 300))

N = 99
print N
for i in range(N):
    print "%d %d" % getStartEnd()
