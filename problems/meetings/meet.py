n = input()

intervals = []
for i in range(n):
    s = tuple(map(int, raw_input().strip().split(' ')) + [1])
    intervals.append(s)

def comp(s1, s2):
    return s1[1] - s2[1] if s1[1] != s2[1] else s1[0] - s2[0]

sor = sorted(intervals, comp)

def greedy(L):
    c = 0
    end = -100
    for i in L:
        if i[0] >= end:
            c += i[2]
            end = i[1]
    return c

maxi = -1
for i in range(len(sor) - 1):
    sorc = []
    for u in range(len(sor)):
        if u == i + 1:
            continue
        elif u == i:
            sorc.append((min(sor[u][0], sor[u+1][0]), max(sor[u][1], sor[u+1][1]), 2))
        else:
            sorc.append(sor[u])
    key = greedy(sorc)
    if key > maxi:
        maxi = key
print maxi
