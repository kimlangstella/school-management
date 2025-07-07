import AddPayment from '@/components/modal/add-payment'
import StudentPaymentsTable from '@/components/table/payment-table'
import React from 'react'

function page() {
  return (
    <div>
            <div className="flex items-end justify-end mr-8 mb-4">
              <AddPayment  />
            </div>
            <div className={"dark text-foreground bg-background p-3"}>
              <h1 className={"dark text-foreground bg-background mb-3 text-3xl"}>Welcome Back!!!</h1>
              <StudentPaymentsTable></StudentPaymentsTable>
            </div>
    </div>
  )
}

export default page
