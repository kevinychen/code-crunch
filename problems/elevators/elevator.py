n = input()

floors = []
for i in range(n):
    floors.append(input())

D = []
for i in range(len(floors) + 1):
    D.append(dict())

D[0][(1,1)] = 0

for i in range(len(floors)):
    floor = floors[i]
    for arr in D[i]:
        val = D[i][arr]
        arr1 = (arr[0], floor)
        arr2 = (floor, arr[1])
        val1 = val + abs(arr[1] - floor)
        val2 = val + abs(arr[0] - floor)
        if arr1 not in D[i + 1]:
            D[i + 1][arr1] = val1
        else:
            D[i + 1][arr1] = min(val1, D[i + 1][arr1])

        if arr2 not in D[i + 1]:
            D[i + 1][arr2] = val2
        else:
            D[i + 1][arr2] = min(val2, D[i + 1][arr2])

minim = 1 << 30
for i in D[len(floors)]:
    if D[len(floors)][i] < minim:
        minim = D[len(floors)][i]
print minim
